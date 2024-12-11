from datetime import datetime

import pandas as pd
from bson import ObjectId
from app.models.data_model import DataCleaningResponse, DataCleaningUpdate
from app.connector.connectorBDD import MongoAccess
from typing import Union
from fastapi import UploadFile
import io

from app.models.data_model import DataCleaningInDB


class DataCleaningCRUD:
    def __init__(self):
        self.db = MongoAccess().data_cleaning_db

    def create_data_cleaning_task(self) -> str:
        """
        Crée une tâche de nettoyage de données avec le statut 'pending' et l'enregistre dans MongoDB.
        """
        task = DataCleaningInDB(status="pending", created_at=datetime.utcnow())
        result = self.db.insert_one(task.dict(by_alias=True))
        return str(result.inserted_id)  # Retourne _id de MongoDB directement

    def upload_data_to_mongo(self, task_id: str, file: UploadFile) -> DataCleaningResponse:
        """
        Lit le fichier fourni, stocke les données dans MongoDB et met à jour la tâche.
        """
        content = file.file.read()
        file_extension = file.filename.split(".")[-1].lower()

        if file_extension == "csv":
            df = pd.read_csv(io.BytesIO(content), delimiter=";", low_memory=False)  # Ajout de low_memory=False
        elif file_extension in ["xls", "xlsx"]:
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise ValueError("Invalid file format: only CSV or Excel files are accepted.")

        if df.empty:
            raise ValueError("The file is empty or has no data.")

        # Convertir chaque ligne en dictionnaire et insérer dans MongoDB
        records = df.to_dict(orient="records")
        for record in records:
            record["task_id"] = task_id  # Associe chaque ligne au même identifiant de tâche

        self.db.insert_many(records)
        self.update_data_cleaning_task(task_id, DataCleaningUpdate(status="completed"))

        return DataCleaningResponse(message="Data uploaded to MongoDB successfully.")

    def update_data_cleaning_task(self, task_id: str, update_data: DataCleaningUpdate):
        """
        Met à jour le statut ou les informations de la tâche de nettoyage.
        """
        self.db.update_one({"_id": ObjectId(task_id)}, {"$set": update_data.dict(exclude_unset=True)})
