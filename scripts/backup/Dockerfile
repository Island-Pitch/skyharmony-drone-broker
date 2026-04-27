FROM postgres:16-alpine
COPY backup.sh restore.sh entrypoint.sh /scripts/
RUN chmod +x /scripts/*.sh
VOLUME /backups
ENTRYPOINT ["sh", "/scripts/entrypoint.sh"]
