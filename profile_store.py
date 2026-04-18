import chromadb
from chromadb.utils import embedding_functions


client = chromadb.PersistentClient(path="./user_profiles")


embedding_fn = embedding_functions.DefaultEmbeddingFunction()


collection = client.get_or_create_collection(
    name="user_profile",
    embedding_function=embedding_fn
)

def store_profile(profile_data: dict):
    """Store user profile in ChromaDB"""
    
    documents = []
    ids = []
    metadatas = []
    
    for key, value in profile_data.items():
        documents.append(f"{key}: {value}")
        ids.append(key.lower().replace(" ", "_"))
        metadatas.append({"field": key, "value": value})
    
    # Pehle purana data delete karo
    existing = collection.get()
    if existing["ids"]:
        collection.delete(ids=existing["ids"])
    
    # Naya data store karo
    collection.add(
        documents=documents,
        ids=ids,
        metadatas=metadatas
    )
    print(f"Profile stored! Total fields: {len(documents)}")

def retrieve_relevant_info(form_fields: list) -> str:
    """Get relevant info from DB for given form fields"""
    
    results = []
    
    for field in form_fields:

        query_result = collection.query(
            query_texts=[field],
            n_results=1
        )
        
        if query_result["documents"][0]:
            results.append(query_result["documents"][0][0])
    
    return "\n".join(results)


if __name__ == "__main__":
    user_profile = {
        "Full Name": "Gaurav Meena",
        "Email": "gaurav@example.com",
        "City": "Sonipat",
        "Phone": "9876543210",
        "College": "MDU Rohtak",
        "Year": "2nd Year",
        "Branch": "Computer Science"
    }
    
    store_profile(user_profile)
    
    fields = ["Full Name", "Email", "City","Phone"]
    relevant_info = retrieve_relevant_info(fields)
    
    print("\nRetrieved info for form fields:")
    print(relevant_info)