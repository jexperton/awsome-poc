# ab3-sam

```
./npm i
./npm run cdk bootstrap
./npm run cdk synth && ./sam local invoke createEntry -e events/add-file.json -t cdk.out/ab3-app.template.json

aws dynamodb create-table \
  --profile ab3 \
  --table-name TranscriptionsTableE617CB71 \
  --attribute-definitions \
  AttributeName=url,AttributeType=S \
  --key-schema \
  AttributeName=url,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --endpoint-url http://localhost:8000

{
  "TableNames": [
    "ab3-app-TranscriptionsTableE617CB71",
    "ab3-app-TranscriptionsTableE617CB71-4L70K1S3S0TM"
  ]
}

https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs-readme.html#reference-project-architecture

./cdk deploy  \
  --parameters loginUrl=http://localhost:3055/signin,https://main.d1ulx6718b296l.amplifyapp.com/signin \
  --parameters logoutUrl=http://localhost:3055/signout,https://main.d1ulx6718b296l.amplifyapp.com/signout \
  --parameters repository=arn:aws:codecommit:ca-central-1:418930842852:ab3-backend \
  --parameters branch=main \
  --parameters opensearchIndex=transcriptions
```
