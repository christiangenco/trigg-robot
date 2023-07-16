# yarnpkg run build

NAME="trigg-robot"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/../frontend" && pwd )"

aws s3 sync $DIR s3://gen.co/$NAME/ --acl=public-read \
  --exclude ".DS_Store" \
  --exclude ".git/*"

aws cloudfront create-invalidation --distribution-id EXW76U2SHH4YQ --paths /$NAME/ /$NAME/index.html /$NAME/favicon.ico /$NAME/script.js
