"""Inicialización idempotente de una tienda para revisión académica local."""
import os
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from apps.core.models import Tienda
from apps.visual_config.models import ConfiguracionVisual
from apps.landing.models import ConfiguracionLanding

if os.environ.get("REVISION_SETUP_ENABLED") != "1" or settings.DATABASES["default"]["NAME"] != "revision_docente" or not settings.DEBUG:
    raise RuntimeError("Solo se permite la instalación local de revisión docente.")

password = os.environ.get("REVISION_OWNER_PASSWORD", "")
if len(password) < 12:
    raise RuntimeError("La contraseña de revisión debe tener al menos 12 caracteres.")

User = get_user_model()
with transaction.atomic():
    users = User.objects.filter(email__iexact="tienda@gmail.com")
    if users.exclude(username="tienda").exists():
        raise RuntimeError("El correo ya está asociado a otro usuario.")
    owner, created = User.objects.get_or_create(
        username="tienda",
        defaults={"email":"tienda@gmail.com","is_staff":True,"is_superuser":True},
    )
    if owner.email.lower() != "tienda@gmail.com":
        raise RuntimeError("El usuario tienda pertenece a otra cuenta.")
    if created:
        owner.set_password(password)
        owner.save(update_fields=["password"])
    elif not owner.check_password(password):
        raise RuntimeError("La clave local no coincide con la cuenta existente; no se cambió.")
    stores = list(Tienda.objects.select_for_update())
    if len(stores) > 1 or (stores and stores[0].id_usuario_propietario_id != owner.pk):
        raise RuntimeError("Hay otra tienda en la base de datos; no se modificarán sus datos.")
    store = stores[0] if stores else Tienda.objects.create(
        id_usuario_propietario=owner, nombre="Tienda Demo",
        descripcion="Tienda de prueba para revisión docente.",
        correo_negocio="tienda@gmail.com",
    )
    ConfiguracionVisual.objects.get_or_create(
        tienda=store, defaults={"plantilla_seleccionada":"editorial"}
    )
    ConfiguracionLanding.objects.get_or_create(
        tienda=store,
        defaults={
            "titulo":"Bienvenidos a Tienda Demo",
            "descripcion":"Sitio de demostración para revisión académica.",
            "texto_boton":"Explorar catálogo",
            "secciones":{},
            "contenido":{},
        },
    )
print("Tienda Demo y usuario administrador preparados correctamente.")
