npm install -g pm2
pm2 start bin/www --name otaserver
pm2 startup
pm2 save