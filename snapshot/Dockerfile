FROM alpine:3.23.2
COPY data.tar /
RUN tar xvf /data.tar -C /

FROM alpine:3.23.2
COPY --from=0 /data/ /data
