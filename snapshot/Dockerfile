FROM alpine:3.18.12
COPY data.tar /
RUN tar xvf /data.tar -C /

FROM alpine:3.18.12
COPY --from=0 /data/ /data
