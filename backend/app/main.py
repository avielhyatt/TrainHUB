from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.migrate import run_migrations
from app.routers import auth, bookings, dashboard, holidays, patients, public, trainers, users
from app.seed_holidays import seed_holidays


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_migrations(engine)
    db = SessionLocal()
    try:
        seed_holidays(db)
    finally:
        db.close()
    yield


app = FastAPI(title="TrainHub API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(trainers.router)
app.include_router(patients.router)
app.include_router(bookings.router)
app.include_router(dashboard.router)
app.include_router(holidays.router)
app.include_router(public.router)


@app.get("/health")
def health():
    return {"status": "ok"}
