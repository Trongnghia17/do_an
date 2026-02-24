"""create_wallet_transactions_table

Revision ID: f129b2aa3191
Revises: j3k4l5m6n7o8
Create Date: 2026-02-23 23:05:52.165221

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f129b2aa3191'
down_revision: Union[str, Sequence[str], None] = 'j3k4l5m6n7o8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create wallet_transactions table
    op.create_table(
        'wallet_transactions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),  # Số tiền thay đổi (âm = trừ, dương = cộng)
        sa.Column('transaction_type', sa.String(length=50), nullable=False),  # 'DEPOSIT', 'AI_GRADING', 'REFUND', etc.
        sa.Column('description', sa.String(length=500), nullable=True),  # Mô tả giao dịch
        sa.Column('reference_id', sa.String(length=100), nullable=True),  # ID tham chiếu (payment_id, exam_id, etc.)
        sa.Column('balance_before', sa.Integer(), nullable=False),  # Số dư trước giao dịch
        sa.Column('balance_after', sa.Integer(), nullable=False),  # Số dư sau giao dịch
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    
    op.create_index(op.f('ix_wallet_transactions_id'), 'wallet_transactions', ['id'], unique=False)
    op.create_index(op.f('ix_wallet_transactions_user_id'), 'wallet_transactions', ['user_id'], unique=False)
    op.create_index(op.f('ix_wallet_transactions_transaction_type'), 'wallet_transactions', ['transaction_type'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_wallet_transactions_transaction_type'), table_name='wallet_transactions')
    op.drop_index(op.f('ix_wallet_transactions_user_id'), table_name='wallet_transactions')
    op.drop_index(op.f('ix_wallet_transactions_id'), table_name='wallet_transactions')
    op.drop_table('wallet_transactions')
