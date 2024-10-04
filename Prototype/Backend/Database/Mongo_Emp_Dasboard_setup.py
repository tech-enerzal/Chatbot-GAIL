import pymongo
from pymongo import MongoClient
import dns  # required for connecting with SRV

# MongoDB Atlas connection string
# Note: It's better to store this in an environment variable
atlas_connection_string = "mongodb+srv://techenerzal:Chatbot%408188@cluster0.najcz.mongodb.net/?retryWrites=true&w=majority"

# Connect to MongoDB Atlas
client = MongoClient(atlas_connection_string)

# Access your database
db = client["KPR_Business_chatbot"]

# Create or access a collection
employees = db["Employee_Dashboard"]

# Create an index on employee_id to ensure uniqueness
employees.create_index([("employee_id", pymongo.ASCENDING)], unique=True)

# Define a sample document
sample_employee = {
    "employee_id": 1,
    "name": "John Doe",
    "department": "IT",
    "job_title": "Software Engineer",
    "salary": 75000.00,
    "leaves_taken_this_month": 2
}

# Insert the sample document
result = employees.insert_one(sample_employee)

print("Connected to MongoDB Atlas successfully.")
print("Sample document inserted with ID:", result.inserted_id)

# Optional: Print the collection details
print("\nCollection details:")
print(f"Number of documents: {employees.count_documents({})}")
print("Indexes:")
for index in employees.list_indexes():
    print(f"  {index['name']}: {index['key']}")

# Close the connection
client.close()