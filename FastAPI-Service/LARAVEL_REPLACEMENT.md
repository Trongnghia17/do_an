# FastAPI thay thế Laravel - Hướng dẫn đầy đủ

## Tổng quan

FastAPI service này được thiết kế để **thay thế hoàn toàn Laravel backend**, không chỉ làm AI service bổ sung.

### So sánh Laravel vs FastAPI

| Aspect | Laravel | FastAPI |
|--------|---------|---------|
| **Language** | PHP 8.x | Python 3.10+ |
| **Database** | MySQL (Eloquent ORM) | MySQL (SQLAlchemy ORM) |
| **Authentication** | Sanctum/Passport | JWT (python-jose) |
| **Admin UI** | Laravel Nova/Filament | React (separate frontend) |
| **API Docs** | Manual (L5-Swagger) | Auto-generated (OpenAPI) |
| **Performance** | Sync | Async (high performance) |
| **File Upload** | Storage facade | aiofiles |
| **Email** | Laravel Mail | emails library |
| **Queue** | Laravel Queue | Celery |
| **Testing** | PHPUnit | pytest |
| **Migrations** | Artisan | Alembic |

## 🔐 Authentication & Authorization

### Laravel → FastAPI Migration

**Laravel (Sanctum):**
```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

// Controller
if (!Auth::user()->hasPermission('users.create')) {
    abort(403);
}
```

**FastAPI (JWT):**
```python
# app/api/v1/endpoints/auth.py
from app.auth import get_current_user, require_permission

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/users")
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_permission("users.create"))
):
    # Logic here
```

### Endpoints tương đương

| Laravel | FastAPI |
|---------|---------|
| POST `/api/register` | POST `/api/v1/auth/register` |
| POST `/api/login` | POST `/api/v1/auth/login` |
| GET `/api/user` | GET `/api/v1/auth/me` |
| POST `/api/logout` | POST `/api/v1/auth/logout` |
| POST `/api/refresh` | POST `/api/v1/auth/refresh-token` |

## 👥 User Management

### CRUD Operations

**Laravel:**
```php
// List users
User::where('is_active', true)->paginate(15);

// Get user
$user = User::findOrFail($id);

// Create user
User::create($request->validated());

// Update user
$user->update($request->validated());

// Soft delete
$user->delete();

// Restore
$user->restore();
```

**FastAPI:**
```python
# List users
GET /api/v1/users/?is_active=true&skip=0&limit=15

# Get user
GET /api/v1/users/{user_id}

# Create user
POST /api/v1/users/
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret"
}

# Update user
PUT /api/v1/users/{user_id}
{
  "name": "John Updated"
}

# Soft delete
DELETE /api/v1/users/{user_id}

# Restore
POST /api/v1/users/{user_id}/restore
```

### Models Comparison

**Laravel User Model:**
```php
class User extends Authenticatable
{
    use SoftDeletes, HasApiTokens;
    
    protected $fillable = [
        'name', 'email', 'password', 'role_id', 'is_active'
    ];
    
    protected $hidden = ['password', 'remember_token'];
    
    public function role() {
        return $this->belongsTo(Role::class);
    }
    
    public function hasPermission($permission) {
        return $this->role->hasPermission($permission);
    }
}
```

**FastAPI User Model:**
```python
from beanie import Document

class User(Document):
    name: str
    email: Indexed(EmailStr, unique=True)
    password: str  # Hashed
    role_id: Optional[str] = None
    is_active: bool = True
    deleted_at: Optional[datetime] = None
    
    class Settings:
        name = "users"
    
    async def get_role(self):
        if self.role_id:
            return await Role.get(self.role_id)
        return None
    
    async def has_permission(self, permission_name: str) -> bool:
        role = await self.get_role()
        if role:
            return await role.has_permission(permission_name)
        return False
```

## 🎓 Exam Management

### Laravel Exam CRUD

```php
// routes/api.php
Route::apiResource('exams', ExamController::class);
Route::apiResource('questions', QuestionController::class);

// ExamController.php
public function index() {
    return Exam::with('tests')->where('is_active', true)->get();
}

public function store(Request $request) {
    $exam = Exam::create($request->validated());
    return response()->json($exam, 201);
}
```

### FastAPI Exam CRUD

```python
# app/api/v1/endpoints/exams.py

@router.get("/")
async def list_exams(
    type: Optional[str] = None,
    is_active: Optional[bool] = None
):
    query = Exam.find(Exam.deleted_at == None)
    if type:
        query = query.find(Exam.type == type)
    if is_active is not None:
        query = query.find(Exam.is_active == is_active)
    return await query.to_list()

@router.post("/", status_code=201)
async def create_exam(exam: Exam):
    await exam.insert()
    return exam
```

## 🎨 Admin UI

**Note:** Admin UI được xây dựng bằng React riêng biệt, không sử dụng backend templates.

FastAPI chỉ cung cấp REST API endpoints cho admin operations:
- GET/POST/PUT/DELETE `/api/v1/users/`
- GET/POST/PUT/DELETE `/api/v1/exams/`
- GET/POST/PUT/DELETE `/api/v1/roles/`
- etc.

## 📁 File Upload & Storage

### Laravel Storage

```php
// Upload file
$path = $request->file('image')->store('images', 'public');

// Get URL
$url = Storage::url($path);

// Delete file
Storage::delete($path);
```

### FastAPI File Upload

```python
from fastapi import UploadFile, File
import aiofiles
import os

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Save file
    file_path = f"storage/uploads/{file.filename}"
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    return {
        "filename": file.filename,
        "path": file_path,
        "url": f"/static/uploads/{file.filename}"
    }

@router.delete("/files/{filename}")
async def delete_file(filename: str):
    file_path = f"storage/uploads/{filename}"
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"message": "File deleted"}
    raise HTTPException(404, "File not found")
```

## 📧 Email & Notifications

### Laravel Mail

```php
Mail::to($user)->send(new WelcomeEmail($user));
```

### FastAPI Email

```python
from emails import Message

async def send_welcome_email(user: User):
    message = Message(
        subject="Welcome to OwlEnglish",
        html=f"<h1>Welcome {user.name}!</h1>",
        mail_from=("OwlEnglish", "noreply@owlenglish.com")
    )
    
    message.send(to=user.email)
```

## 🔄 Migration từ Laravel sang FastAPI

### Step 1: Export data from MySQL

```bash
# Export users
mysqldump -u root -p owlenglish users > users.sql

# Or use Laravel command
php artisan db:seed --class=ExportToMongoSeeder
```

### Step 2: Import to MongoDB

```python
# scripts/migrate_from_laravel.py
import pymongo
import mysql.connector

# Connect to MySQL
mysql_conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="owlenglish"
)

# Connect to MongoDB
mongo_client = pymongo.MongoClient("mongodb://localhost:27017")
mongo_db = mongo_client["owlenglish_ai"]

# Migrate users
cursor = mysql_conn.cursor(dictionary=True)
cursor.execute("SELECT * FROM users WHERE deleted_at IS NULL")

for row in cursor:
    user_doc = {
        "name": row["name"],
        "email": row["email"],
        "password": row["password"],  # Already hashed
        "role_id": str(row["role_id"]) if row["role_id"] else None,
        "is_active": bool(row["is_active"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "deleted_at": row["deleted_at"],
    }
    mongo_db.users.insert_one(user_doc)

print("Migration completed!")
```

### Step 3: Update React Frontend

```javascript
// Before (Laravel)
const API_URL = 'http://localhost:8001/api';

// After (FastAPI)
const API_URL = 'http://localhost:8000/api/v1';

// Update auth calls
const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    username: email,  // OAuth2 format
    password: password,
  });
  return response.data;
};
```

## 🚀 Running Both Services (Transition Period)

During migration, you can run both:

```bash
# Terminal 1: Laravel (legacy)
cd Laravel
php artisan serve --port=8001

# Terminal 2: FastAPI (new)
cd FastAPI-Service
poetry run python run.py  # port 8000

# Terminal 3: React
cd React
npm run dev
```

React can use environment variables:

```env
VITE_LEGACY_API_URL=http://localhost:8001/api
VITE_API_URL=http://localhost:8000/api/v1
```

## 📊 Feature Parity Checklist

- [x] User Authentication (Register, Login, Logout)
- [x] User CRUD Operations
- [x] Role-based Access Control (RBAC)
- [x] Permission System
- [x] Soft Delete Support
- [x] Exam Management (CRUD)
- [x] Question Management (CRUD)
- [x] AI Question Generation
- [x] AI Grading (Writing, Speaking)
- [x] Admin Panel UI
- [ ] File Upload & Storage
- [ ] Email Sending
- [ ] OTP Verification
- [ ] OAuth Social Login
- [ ] Password Reset
- [ ] API Rate Limiting
- [ ] Background Jobs (Celery)
- [ ] Real-time Notifications

## 🎯 Advantages of FastAPI over Laravel

### Performance
- **Async operations**: Handle multiple requests concurrently
- **Faster response times**: Python async is very fast
- **Lower resource usage**: More efficient than PHP

### Development
- **Auto-generated API docs**: Swagger UI out of the box
- **Type safety**: Pydantic models with validation
- **Modern Python**: Clean, readable code
- **Great IDE support**: VSCode, PyCharm auto-completion

### AI Integration
- **Native Python**: Direct access to ML/AI libraries
- **OpenAI integration**: Seamless ChatGPT API calls
- **Data science tools**: NumPy, Pandas, etc.

### Scalability
- **Horizontal scaling**: Easy to add more instances
- **MongoDB**: Flexible schema for evolving requirements
- **Microservices ready**: Can split into multiple services

## 🔧 Configuration

### FastAPI .env (tương đương Laravel .env)

```bash
# App
APP_NAME="OwlEnglish"
APP_ENV=production
DEBUG=False
SECRET_KEY=your-secret-key-here

# Database (MongoDB thay vì MySQL)
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=owlenglish

# JWT (thay vì Sanctum)
SECRET_KEY=your-jwt-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Email
MAIL_FROM_NAME="OwlEnglish"
MAIL_FROM_ADDRESS=noreply@owlenglish.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# AI
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4-turbo-preview

# Storage
UPLOAD_DIR=storage/uploads
MAX_UPLOAD_SIZE=10485760  # 10MB
```

## 📝 Notes

- **Database change**: MySQL → MongoDB (flexible schema)
- **ORM change**: Eloquent → Beanie (async ODM)
- **Auth change**: Sanctum → JWT
- **Admin UI**: React-based separate frontend (no backend templates)
- **All Laravel features** có thể replicate trong FastAPI
- **React frontend** có thể dùng với cả 2 backends

FastAPI mạnh hơn cho:
- AI/ML integration
- High performance APIs
- Modern Python ecosystem
- Async operations

Laravel tốt cho:
- Traditional web apps
- Mature ecosystem
- Large PHP team
