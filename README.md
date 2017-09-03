### Install Steps
#### Linux Ubuntu 16

```
cd ~
sudo apt-get install python-pip
pip install virtualenv
mkdir projects
cd projects
virtualenv pechallenge
cd pechallenge
source bin/activate
git clone
cd emergency_enrich
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
