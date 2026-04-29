# Python — Django Patterns

**Principle:** Use Django's conventions. Fat models, thin views. Leverage the ORM's power. Signals for decoupled side effects. Admin for quick internal tooling.

## Pattern Examples

### 1. Model with Validation and Manager
```python
from django.db import models
from django.core.exceptions import ValidationError

class ActiveManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)

class User(models.Model):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()
    active = ActiveManager()

    def clean(self):
        if self.name and len(self.name) < 2:
            raise ValidationError({'name': 'Name must be at least 2 characters.'})
```

### 2. Serializer with Nested Writes
```python
from rest_framework import serializers

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['street', 'city', 'country']

class UserSerializer(serializers.ModelSerializer):
    address = AddressSerializer()

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'address']

    def create(self, validated_data):
        address_data = validated_data.pop('address')
        user = User.objects.create(**validated_data)
        Address.objects.create(user=user, **address_data)
        return user
```

### 3. Signals for Side Effects
```python
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    if created:
        send_email.delay(to=instance.email, template='welcome')
```

## Anti-Patterns
- **Logic in views** — move business logic to model methods or service layer
- **N+1 queries** — use `select_related` (FK) and `prefetch_related` (M2M) in querysets
- **Raw SQL for simple queries** — use ORM. Raw SQL only for complex analytics or performance
- **Overusing signals** — use for cross-cutting concerns only. Direct calls for core business logic.

## Integration Points
- **REST:** Django REST Framework with ViewSets, Routers, and Permissions
- **Async:** Django 4.1+ supports async views and ORM queries
- **Admin:** `ModelAdmin` with `list_display`, `search_fields`, `list_filter` for quick CRUD interfaces
