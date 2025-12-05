from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=3600,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()


async def connect_to_db():
    """Connect to MySQL database"""
    try:
        async with engine.begin() as conn:
            # Test connection
            await conn.run_sync(lambda _: None)
        print(f"✅ Connected to MySQL database: {settings.DB_DATABASE}")
    except Exception as e:
        print(f"❌ Failed to connect to MySQL database: {e}")
        raise


async def close_db_connection():
    """Close MySQL database connection"""
    await engine.dispose()
    print("Closed MySQL database connection")


async def get_db() -> AsyncSession:
    """Get database session - use as dependency in FastAPI routes"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
