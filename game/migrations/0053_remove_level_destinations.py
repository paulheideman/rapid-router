# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('game', '0052_merge'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='level',
            name=b'destinations',
        ),
    ]
