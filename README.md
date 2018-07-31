# Attendance Tracker

This application is used to manually track attendance at crossroads sites and generate reports. It consists of an Angular client and a nodejs server. This repo contains the nodejs server. As of this writing the Angular client will be hosted on Netlify at attendancetracker.crossroads.net. The nodejs backend will be hosted in a container on a kubernetes cluster at api.crossroads.net/attendancetracker.

# NODEJS Build Process

From the root directory -
To Build: `docker-compose -f deployment/docker/docker-compose-local.yml build`

NOTE: Check the environment variables section or the `Run` phase will fail.
To Run: `docker-compose -f deployment/docker/docker-compose-local.yml up`

The application should be available at localhost. You can test this with the route `http://localhost/api/sites`

This build process is used to build and deploy the application to Kubernetes using Team City.

# Environment variables needed

You can create a .env file inside the deployment/docker folder with the following variables defined with values to run locally.

Check ci/cd server for values

NODE_ENV=prod
DB_HOST
DB_NAME
DB_USER
DB_PASS

TABLE_PREFIX_USER
TABLE_PREFIX_SITE
TABLE_PREFIX_SERVICE
TABLE_PREFIX_MINISTRY
TABLE_PREFIX_ENTRY_TYPE
TABLE_PREFIX_SERVICE_INSTANCE
TABLE_PREFIX_REPORT_HASH

CRDS_API_KEY

CONFIG_SESSION_SECRET
CONFIG_AUTH_URL
CONFIG_SENDGRID_API_KEY
CONFIG_SENDGRID_FROM_EMAIL