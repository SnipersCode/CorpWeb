FROM jwilder/nginx-proxy

COPY nginx/nginx.tmpl /app/nginx.tmpl

COPY scripts/vendor-bundle.js /data/www/scripts/
COPY materialize-css /data/www/materialize-css/

COPY index.html /data/www/

COPY scripts/app-bundle.js /data/www/scripts/

COPY static /data/www/static/

EXPOSE 80
