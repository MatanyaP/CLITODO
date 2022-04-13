#!/bin/bash
DIRNAME=${1:-.}
cd "$DIRNAME"

FILES=$(mktemp)
PACKAGES=$(mktemp)

export NUMCONCURRENT=8

function findCmd {
  startPath=${1:-.}
  find "$startPath" \
    -path ./node_modules -prune -or \
    -path ./build -prune -or \
    \( -name "*.ts" -or -name "*.js" -or -name "*.json" \) -print
}

# use fd
# https://github.com/sharkdp/fd
function findCmd_fd {
  startPath=${1:-.}
  fd  -t f '(js|ts|json)$' "$startPath"
}



function check {
    cat package.json \
        | jq "{} + .$1 | keys" \
        | sed -n 's/.*"\(.*\)".*/\1/p' > "$PACKAGES"
    echo "--------------------------"
    echo "Checking $1..."

    findCmd > "$FILES"
    while read PACKAGE
    do
        #echo "node_modules/${PACKAGE}"
        if [ -d "node_modules/${PACKAGE}" ]; then
                findCmd node_modules/${PACKAGE} >> $FILES
        fi
    done < $PACKAGES
    export FILES
    export SQ="'"
    xargs -P ${NUMCONCURRENT:-1} -r -a  "$PACKAGES" -I[] bash -c '
        PACKAGE="[]"

        RES=$(cat "$FILES" | xargs -r egrep -i "(import|require|loader|plugins|${PACKAGE}).*[\"${SQ}](${PACKAGE}|.?\d+)[\"${SQ}]" | wc -l)

        if [ $RES = 0 ]
        then
            echo -e "UNUSED\t\t $PACKAGE"
        else
            echo -e "USED ($RES)\t $PACKAGE"
        fi
    '
    [ -f  "$PACKAGES" ] && rm "$PACKAGES"
    [ -f  "$FILES" ] && rm "$FILES"
}

check "dependencies"
check "devDependencies"
check "peerDependencies"

echo "Done"
read -rsp $'Press enter to continue...\n'