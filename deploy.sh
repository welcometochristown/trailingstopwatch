#!/bin/bash

echo "stopping api"
systemctl stop trailingstopwatch

echo "cleaning directory..."
rm -R /var/www/html/trailingstopwatch.welcometochristown.com/*

echo "deploying api..."
cp -r api /var/www/html/trailingstopwatch.welcometochristown.com

echo "deploying client"
cd client
npm run build
cp -r build/* /var/www/html/trailingstopwatch.welcometochristown.com

echo "starting api"
systemctl start trailingstopwatch

echo "finished"
