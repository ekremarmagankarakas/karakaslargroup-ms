#!/bin/bash
awslocal s3api head-bucket --bucket karakaslar-uploads 2>/dev/null \
  || awslocal s3 mb s3://karakaslar-uploads --region eu-central-1
