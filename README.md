# llm_data_viz
Chat with your data to view beautiful visualizations

## Steps to run
./docker-clean.sh
docker compose up --build


## How to make an django app 
cd backend
python manage.py startapp [app_name]
In the backend folder, add the [app_name] to the list of installed apps in settings.py
python manage.py makemigrations [app_name]
docker exec -it langviz-backend-1 /bin/sh  
python manage.py migrate