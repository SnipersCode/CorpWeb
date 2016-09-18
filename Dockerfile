FROM jwilder/nginx-proxy

COPY nginx /etc/nginx/conf.d

COPY scripts/vendor-bundle.js /data/www/scripts/
COPY materialize-css /data/www/materialize-css/

COPY index.html /data/www/

COPY scripts/app-bundle.js /data/www/scripts/
COPY scripts/app-bundle.js.map /data/www/scripts/

COPY static /data/www/static/

EXPOSE 80
