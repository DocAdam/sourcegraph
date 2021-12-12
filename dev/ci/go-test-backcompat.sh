#!/usr/bin/env bash

# This script runs the go-build.sh in a clone of the previous minor release as part
# of the continuous backwards compatibility regression tests.

cd "$(dirname "${BASH_SOURCE[0]}")/../../"
set -ex

#
# TODO - this script is VERY noisy
#

function latest_minor_release() {
  for tag in $(git tag | grep -P 'v3.(\d+).0$' | cut -d'.' -f2 | sort -nr | xargs -I _ echo "v3._.0"); do
    if ! git merge-base --is-ancestor HEAD "${tag}"; then
      echo "${tag}"
      return
    fi
  done
}

current=$(git rev-parse HEAD)
tag="$(latest_minor_release)"
commit=$(git merge-base "${current}" "${tag}")
flakefile="./dev/ci/backcompat-flake/${tag}.json"

if git diff --quiet "${commit}".."${current}" migrations; then
  echo "--- No schema changes"
  echo "No schema changes since last minor release"
  exit 0
fi

echo "--- Running backwards compatibility tests"
echo ""
echo "current=${current}"
echo "commit=${commit}"
echo "tag=${tag}"
echo ""
echo "Database schema remained defined in HEAD=\${commit}."
echo "Performing Go unit tests defined in \${tag}/\${commit}."
echo
echo "New failures of these tests indicate that new changes to the"
echo "database schema do not allow for continued proper operation of"
echo "Sourcegraph instances deployed at the previous release."

git checkout "${commit}"
git checkout "${current}" -- ./migrations
git checkout "${current}" -- ./dev/ci/go-test.sh # test
git checkout "${current}" -- ./dev/ci/backcompat-flake/
./.buildkite/hooks/pre-command

if [ -f "${flakefile}" ]; then
  echo "Disabling tests listed in flakefile ${flakefile}"

  for path in $(jq -r '.[].path' <"${flakefile}"); do
    for test in $(jq -r ". | map(select(.path == \"${path}\")) | .[].tests[]" <"${flakefile}"); do
      sed -i_bak "s/func ${test}/func _${test}/g" "${path}"

      if diff "${path}" "${path}_bak"; then
        echo "Unknown test in ${path}: ${test}"
        exit 1
      fi

      # TODO - trap instead?
      rm "${path}_bak"
    done
  done
fi

#
# TODO - add lots of docs here on failure about what to do
./dev/ci/go-test.sh "$@"
