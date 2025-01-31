# Introduction

## Overview
This is the backend project of the **video-sharing-application**.

Here is the [repository of the frontend](https://github.com/harryduong99/video-sharing-frontend).

## Purpose
Our client app need HTTP REST APIs and order services to be able to function. This project basically a backend and handle all background work. 
## Key features

Analyze the main features (requirements) for the application
1. Authentication features (users)
  - Registration
  - Login
  - Logout
2. Videos related features
  - Sharing video and send real-time notification
  - View list of videos

Then for this backend project, we do support:
- API endpoints for authentication
- API endpoints for video sharing
- Broadcasting notification of video sharing to other logged-in users

# Prerequisites

## Software
- OS: macOS, Windows and Linux are supported
- Docker
- Npm: v10 is version recommended

## Tools

No specific tool required for this project. For viewing and managing docker containers, can choose a docker UI client that support the OS. But using terminal should be enough.

# Installation & Configuration

Follow these step to have the project work locally

1. Clone the repository from github
2. Create `.env` file based on the `.env.example`. 
  The `DATABASE_URL` is the postgres connection uri that can be generated by prisma: `prisma init` or manually prepared. 
  The `GOOGLE_API_KEY` is the key of google project, you can create a new one or get from your exiting project. The instruction can be found [here](https://support.google.com/googleapi/answer/6158862?hl=en)
  `APP_ORIGIN` is the url of the client app (frontend project)
  `JWT_TOKEN_SECRET` is needed for authentication (users) flows, make sure you prepared a string for it and keep it secret.
3. Create `docker.env` file based on the `docker-example.env` file. By using a separate env file for docker compose, we ensure that the docker-compose file will not expose sensitive information.
4. Make sure no local port that is defined in the docker-compose file is already in used in the local machine.
5. Run `npm install` to install dependency, you can run the app directly if docker is too heavy for your local machine. But that's not recommended.
6. Start/ build the docker containers: `docker compose up`

# Database Setup

Make sure the postgres DB container is running, then can start migration and seeding.
## Migration
Run migration for the defined schemas, after running, table `videos` and `users` should be created: `npx prisma migrate dev`

## Seed
The project uses Prisma's seed feature to create the dummy data. Run it directly on the local machine: `npx prisma db seed`.
After running this command, you should have 4 videos and 2 users accounts created:
> User1: 
>Email: user1@example.com
>Password: 123123 

> User2:
>Email: user2@example.com
>Password: 123123 

Note that the `DB_HOST` for local machine and for the docker container is different (Normally is `localhost` for local machine).

# Running the Application

## Start the service
After having all configuration set up. You can start the application and run it under the hood: `docker compose up -d`. There are a lot of useful options for docker compose command. Can explore it [in the official doc](https://docs.docker.com/compose/reference/).

No need to care about the `docker-compose.prod.yml` file, this is used for production environment only and will be mentioned in the Docker deployment section.

## Testing

The project is based on NestJs, which helps the testing quite straightforward. There are 2 types of test are written in this project: Unit testing and End-to-End testing.

### Unit testing

All the controller and services have their own test. To run the test: `npm run test`.

<img width="578" alt="Screen Shot 2024-05-28 at 10 58 46" src="https://github.com/harryduong99/video-sharing-backend/assets/33088334/b1c2747f-2291-49ff-83a5-1c3150b17047">

### End to End testing

NestJs also provide end to end test, this kind of test covers the interaction of classes at a more aggregate level -- closer to the kind of end-user's interaction will have with the production system.
To run test: `npm run test:e2e`

<img width="518" alt="Screen Shot 2024-05-28 at 11 02 22" src="https://github.com/harryduong99/video-sharing-backend/assets/33088334/a8da7c05-250f-43de-be04-714942c8765a">

### Todo

Set up tests with Continuous Integration (CI) is an important step. This is more or less belong to the development process/ management but not purely technical thing. Every opened PR must pass the test before getting merged. This is a standard approach. 

# Docker Deployment

Docker help to eliminate the pain when setting a project, no matter it's locally or for deployment.
The Dockerfile gives instructions so docker can automatically build the image.
## A basic deployment
In our case, the backend and the frontend will be both deployed on the AWS EC2 instance.
For this backend project, the step to have it deployed is quite simple:

1. Create an AWS EC2 instance.
2. (Create) assign a security group for that instance, config inbound rules for that security group to allow SSH, HTTP and port `3000` (Custom TCP) - as our default port for backend running is 3000. Can get rid of this but it's no need for now.
3. SSH to the EC2 instance, now you can control it via terminal. 
4. Clone the project from github, setup ssh key for the instance if need.
5. Install `docker` and other required packages, depends on type of instance. In this project, Ubuntu OS was choosen
6. Create `.env` and `docker.env` file (For example: `nano .env`) and then add sensitive environment variables to it. Make sure we're pointing to the correct frontend origin (`APP_ORIGIN`)
7. Build and start the docker container: we use `docker-compose.prod.yml` file => Run: `docker compose -f docker-compose.prod.yml up --build -d`. This step might takes time.
8. Verify if the service is up: access the URL via browser: `{Public IPv4 address}:3000/ping`, we should see `pong` response. This endpoint in the project is for health checking.

Our deployed backend:
> http://3.93.48.247:3000/ping (deprecated - server temporarily shutdown)

Our application:
> http://3.93.48.247:3001/ (deprecated - server temporarily shutdown)
## Todo

A full AWS solution but not a only EC2 should be applied for this when it come to the real world. RDS, Load balancer (ELB), Auto Scaling Group, Disaster prevention (multi AZ)...

# Usage

After login, user can share video and other logged in users can expect to receive a real time the notification about it.
This feature might not simple as it is for the scaling scenario.

1. Access ~~`http://3.93.48.247:3001/`~~
2. Login User1 or User2
3. Share a video, for example User1 share: `https://youtu.be/eJ4i-QbXG54?si=fvjVF6SB-JN4Uv_I`. user 2 should receive a notification about a video that shared by `user1@example.com`.

# Troubleshooting

## Common issues

1. Can not build and start with docker (`docker compose up`):
- Check if the required ports are free on your local machine
- check the device space, if too many images are existing, then try delete them: `docker container rm 'container_id'`, `docker image rm 'image_id'` or even run `docker system prune`
- Check network connection (`npm ci` step)
