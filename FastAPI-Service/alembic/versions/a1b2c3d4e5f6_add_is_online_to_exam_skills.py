"""add is_online to exam_skills

Revision ID: a1b2c3d4e5f6
Revises: ce52f0462e3b
Create Date: 2025-12-06 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'ce52f0462e3b'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_online column to exam_skills table
    op.add_column('exam_skills', 
        sa.Column('is_online', sa.Boolean(), nullable=False, server_default='1')
    )


def downgrade():
    # Remove is_online column from exam_skills table
    op.drop_column('exam_skills', 'is_online')
