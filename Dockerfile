FROM node:lts-alpine3.11

WORKDIR /src

COPY . .

RUN yarn install && yarn build

FROM grafana/grafana:7.0.3

COPY --from=0 /src/dist /var/lib/grafana/plugins/chaos-mesh-datasource/dist
