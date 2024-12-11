from pydantic import BaseModel, Field, validator
from typing import Optional
from bson import ObjectId
from datetime import datetime
from fastapi import UploadFile

# Modèle de base pour les requêtes de nettoyage de données
class DataCleaningRequest(BaseModel):
    """
    Modèle pour initier une requête de nettoyage de données, avec validation d'extension de fichier.
    """
    file: UploadFile

    @validator("file")
    def validate_file_extension(cls, file: UploadFile):
        """
        Valide que le fichier a une extension .csv ou .xlsx.
        """
        if not (file.filename.endswith(".csv") or file.filename.endswith(".xlsx")):
            raise ValueError("Invalid file type. Only .csv and .xlsx files are allowed.")
        return file

class DataCleaningResponse(BaseModel):
    message: str
    output_file: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "message": "Nettoyage des données terminé avec succès.",
                "output_file": "cleaned_data.xlsx"
            }
        }

# Modèle pour représenter les données de nettoyage stockées en base de données
class DataCleaningInDB(BaseModel):
    """
    Modèle pour les entrées de nettoyage stockées en base de données.
    """
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    output_file: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "pending"  # Statut par défaut

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "output_file": "/uploads/cleaned_data.csv",
                "created_at": "2024-11-05T12:34:56",
                "status": "completed"
            }
        }

# Modèle pour les mises à jour du statut de la tâche de nettoyage
class DataCleaningUpdate(BaseModel):
    """
    Modèle pour mettre à jour les informations d'une tâche de nettoyage de données.
    """
    status: Optional[str] = None
    output_file: Optional[str] = None

    @validator("status")
    def validate_status(cls, value):
        valid_statuses = ["pending", "in_progress", "completed", "failed"]
        if value not in valid_statuses:
            raise ValueError(f"{value} n'est pas un statut valide")
        return value
