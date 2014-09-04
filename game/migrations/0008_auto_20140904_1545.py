# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('game', '0007_added_block__limits'),
    ]

    operations = [
        migrations.AlterField(
            model_name='attempt',
            name='score',
            field=models.FloatField(default=0, null=True),
        ),
    ]
