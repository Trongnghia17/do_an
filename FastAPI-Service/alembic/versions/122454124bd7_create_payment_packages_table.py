"""create_payment_packages_table

Revision ID: 122454124bd7
Revises: g7h8i9j0k1l2
Create Date: 2026-01-10 02:18:19.538340

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '122454124bd7'
down_revision: Union[str, Sequence[str], None] = 'g7h8i9j0k1l2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create payment_packages table
    op.create_table(
        'payment_packages',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('owl_amount', sa.Integer(), nullable=False),
        sa.Column('bonus_owl', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('label', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payment_packages_id'), 'payment_packages', ['id'], unique=False)
    
    # Insert default packages
    op.execute("""
        INSERT INTO payment_packages (amount, owl_amount, bonus_owl, label, description, is_active, display_order)
        VALUES
            (10000, 100, 0, '10,000đ', 'Gói cơ bản', 1, 1),
            (50000, 500, 0, '50,000đ', 'Gói phổ biến', 1, 2),
            (100000, 1000, 100, '100,000đ', 'Gói ưu đãi +10%', 1, 3),
            (200000, 2000, 200, '200,000đ', 'Gói ưu đãi +10%', 1, 4),
            (500000, 5000, 500, '500,000đ', 'Gói ưu đãi +10%', 1, 5),
            (1000000, 10000, 1500, '1,000,000đ', 'Gói VIP +15%', 1, 6)
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_payment_packages_id'), table_name='payment_packages')
    op.drop_table('payment_packages')
