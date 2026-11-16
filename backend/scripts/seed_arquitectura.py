"""Datos ficticios de evaluación. Ejecutar solo mediante el entorno de Arquitectura."""
import os
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from apps.core.models import Tienda
from apps.visual_config.models import ConfiguracionVisual
from apps.catalog.application.use_cases import CreateProductUseCase
from apps.catalog.infrastructure.repositories import ProductRepository
from apps.catalog.presentation.serializers import ProductCreateSerializer

if not settings.DEBUG or settings.DATABASES['default']['NAME'] != 'arquitectura_demo' or settings.MONGO_DB_NAME != 'arquitectura_demo':
    raise RuntimeError('Solo se permite la base aislada de Arquitectura.')
email = 'demo@ecocrespo.example'
password = os.environ['ARQ_DEMO_OWNER_PASSWORD']
User = get_user_model()
with transaction.atomic():
    store = Tienda.objects.select_for_update().first()
    if store and (Tienda.objects.count() != 1 or store.id_usuario_propietario.email != email):
        raise RuntimeError('Ya existe otra tienda. No se modificaran sus datos.')
    owner, created = User.objects.get_or_create(username=email, defaults={
        'email': email, 'first_name': 'Demo', 'last_name': 'EcoCrespo', 'is_staff': True,
    })
    if owner.email != email:
        raise RuntimeError('La cuenta de demostracion no coincide.')
    if created:
        owner.set_password(password)
        owner.save(update_fields=['password'])
    elif not owner.check_password(password):
        raise RuntimeError('La clave local no coincide con la cuenta existente.')
    if not store:
        store = Tienda.objects.create(id_usuario_propietario=owner, nombre='EcoCrespo',
            descripcion='Tienda de plantas y accesorios. Datos ficticios para evaluación académica.')
    ConfiguracionVisual.objects.get_or_create(tienda=store, defaults={'plantilla_seleccionada': 'minimal'})
repo = ProductRepository()
samples = [
    ('ARQ-DEMO-POTUS', 'Potus', 'Planta trepadora de interior. Ejemplo académico.', 7990, 12),
    ('ARQ-DEMO-SUCULENTA', 'Suculenta', 'Planta de tamaño pequeño. Ejemplo académico.', 3990, 8),
    ('ARQ-DEMO-MACETA', 'Maceta decorativa', 'Accesorio para plantas. Ejemplo académico.', 5990, 5),
]
for sku, name, desc, price, stock in samples:
    if repo.get_by_sku(str(store.pk), sku):
        continue
    serializer = ProductCreateSerializer(data={'nombre': name, 'descripcion': desc,
        'categoria': 'Accesorios' if sku.endswith('MACETA') else 'Plantas', 'activo': True,
        'variantes': [{'sku': sku, 'precio': price, 'stock': stock, 'atributos_variante': []}]},
        context={'tienda_id': str(store.pk)})
    serializer.is_valid(raise_exception=True)
    CreateProductUseCase(repo).execute(str(store.pk), serializer.validated_data)
print('Tienda de evaluación y catálogo ficticio preparados.')
