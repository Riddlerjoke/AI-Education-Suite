from datetime import timedelta

from bson import ObjectId
from fastapi import APIRouter, HTTPException, UploadFile, File, Security

from app.api.dependencies import get_current_user, check_user_role
from app.crud.data_crud import (DataCleaningCRUD)
from app.models.data_model import DataCleaningResponse

router = APIRouter()

# Instanciation de l'objet CRUD pour les opérations de nettoyage de données
data_cleaning_crud = DataCleaningCRUD()


@router.post("/data-cleaning", response_model=dict)
async def data_cleaning(file: UploadFile, current_user=Security(get_current_user)):
    check_user_role(current_user, ["SuperAdmin", "DataCleaner"])

    try:
        # Créer la tâche et récupérer son _id
        task_id = data_cleaning_crud.create_data_cleaning_task()
        # Charger les données et associer au même _id
        response = data_cleaning_crud.upload_data_to_mongo(task_id, file)
        # Retourner l'identifiant de la tâche pour le suivi
        return {"_id": task_id}  # Retourne _id comme identifiant unique
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/data-cleaning/{task_id}/status", response_model=DataCleaningResponse)
async def get_data_cleaning_status(task_id: str, current_user=Security(get_current_user)):
    check_user_role(current_user, ["DataOperator", "SuperAdmin", "Viewer"])

    # Recherche la tâche avec l’ID MongoDB
    task = data_cleaning_crud.db.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return DataCleaningResponse(
        message=f"Task is currently {task.get('status')}",
        output_file=task.get("output_file")
    )