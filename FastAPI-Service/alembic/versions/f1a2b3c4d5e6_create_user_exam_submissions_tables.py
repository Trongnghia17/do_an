"""Create user exam submissions tables

Revision ID: f1a2b3c4d5e6
Revises: a1b2c3d4e5f6
Create Date: 2025-12-11 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create exam_submissions table
    op.create_table('exam_submissions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('exam_skill_id', sa.Integer(), nullable=False),
        sa.Column('exam_section_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),  # in_progress, completed, graded
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.Column('time_spent', sa.Integer(), nullable=True),  # seconds
        sa.Column('total_score', sa.Float(), nullable=True),
        sa.Column('max_score', sa.Float(), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exam_skill_id'], ['exam_skills.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exam_section_id'], ['exam_sections.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_exam_submissions_id'), 'exam_submissions', ['id'], unique=False)
    op.create_index(op.f('ix_exam_submissions_user_id'), 'exam_submissions', ['user_id'], unique=False)
    op.create_index(op.f('ix_exam_submissions_exam_skill_id'), 'exam_submissions', ['exam_skill_id'], unique=False)
    
    # Create user_exam_answers table
    op.create_table('user_exam_answers',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('submission_id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('answer_text', sa.Text(), nullable=True),
        sa.Column('answer_audio', sa.String(length=500), nullable=True),  # path to audio file
        sa.Column('is_correct', sa.Boolean(), nullable=True),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('ai_feedback', sa.Text(), nullable=True),  # JSON string with AI grading feedback
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['submission_id'], ['exam_submissions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['exam_questions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_exam_answers_id'), 'user_exam_answers', ['id'], unique=False)
    op.create_index(op.f('ix_user_exam_answers_submission_id'), 'user_exam_answers', ['submission_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_user_exam_answers_submission_id'), table_name='user_exam_answers')
    op.drop_index(op.f('ix_user_exam_answers_id'), table_name='user_exam_answers')
    op.drop_table('user_exam_answers')
    
    op.drop_index(op.f('ix_exam_submissions_exam_skill_id'), table_name='exam_submissions')
    op.drop_index(op.f('ix_exam_submissions_user_id'), table_name='exam_submissions')
    op.drop_index(op.f('ix_exam_submissions_id'), table_name='exam_submissions')
    op.drop_table('exam_submissions')
