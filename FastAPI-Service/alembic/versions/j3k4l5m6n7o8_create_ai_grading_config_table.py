"""create ai_grading_config table

Revision ID: j3k4l5m6n7o8
Revises: i1j2k3l4m5n6
Create Date: 2026-02-23 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'j3k4l5m6n7o8'
down_revision: Union[str, None] = '122454124bd7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create ai_grading_config table
    op.create_table(
        'ai_grading_config',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('skill_type', sa.String(length=50), nullable=False),  # 'writing' or 'speaking'
        sa.Column('cost_per_grading', sa.Integer(), nullable=False),  # Số Trứng Cú cần trả
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index(op.f('ix_ai_grading_config_id'), 'ai_grading_config', ['id'], unique=False)
    op.create_index(op.f('ix_ai_grading_config_skill_type'), 'ai_grading_config', ['skill_type'], unique=True)
    
    # Insert default config
    op.execute("""
        INSERT INTO ai_grading_config (skill_type, cost_per_grading, description, is_active)
        VALUES
            ('writing', 50, 'Chi phí chấm 1 bài Writing bằng AI', 1),
            ('speaking', 50, 'Chi phí chấm 1 bài Speaking bằng AI', 1)
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_ai_grading_config_skill_type'), table_name='ai_grading_config')
    op.drop_index(op.f('ix_ai_grading_config_id'), table_name='ai_grading_config')
    op.drop_table('ai_grading_config')
