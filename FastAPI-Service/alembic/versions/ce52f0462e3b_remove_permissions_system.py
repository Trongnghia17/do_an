"""remove_permissions_system

Revision ID: ce52f0462e3b
Revises: 0f17275325f2
Create Date: 2025-12-04 15:16:59.835454

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ce52f0462e3b'
down_revision: Union[str, Sequence[str], None] = '0f17275325f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Remove permissions system, keep only roles."""
    # Check if tables exist before dropping
    from sqlalchemy import inspect
    from sqlalchemy.engine import reflection
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Drop user_permissions table if exists
    if 'user_permissions' in existing_tables:
        op.drop_index(op.f('ix_user_permissions_id'), table_name='user_permissions')
        op.drop_table('user_permissions')
    
    # Drop role_permissions table if exists
    if 'role_permissions' in existing_tables:
        op.drop_index(op.f('ix_role_permissions_id'), table_name='role_permissions')
        op.drop_table('role_permissions')
    
    # Drop permissions table if exists
    if 'permissions' in existing_tables:
        op.drop_index(op.f('ix_permissions_name'), table_name='permissions')
        op.drop_index(op.f('ix_permissions_id'), table_name='permissions')
        op.drop_table('permissions')


def downgrade() -> None:
    """Downgrade schema - Restore permissions system."""
    # Recreate permissions table
    op.create_table('permissions',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('display_name', sa.String(length=255), nullable=False),
    sa.Column('category', sa.String(length=50), nullable=True),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_permissions_id'), 'permissions', ['id'], unique=False)
    op.create_index(op.f('ix_permissions_name'), 'permissions', ['name'], unique=True)
    
    # Recreate role_permissions table
    op.create_table('role_permissions',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('role_id', sa.Integer(), nullable=False),
    sa.Column('permission_id', sa.Integer(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_role_permissions_id'), 'role_permissions', ['id'], unique=False)
    
    # Recreate user_permissions table
    op.create_table('user_permissions',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('permission_id', sa.Integer(), nullable=False),
    sa.Column('granted', sa.Boolean(), nullable=False),
    sa.Column('expires_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_permissions_id'), 'user_permissions', ['id'], unique=False)
