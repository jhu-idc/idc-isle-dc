FROM alpine:3.23.3
COPY data.tar /
RUN tar xvf /data.tar -C /

FROM alpine:3.23.3
COPY --from=0 /data/ /data
