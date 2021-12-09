package images

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/opencontainers/go-digest"
	"github.com/sourcegraph/sourcegraph/dev/sg/internal/images/reference/reference"

	"sigs.k8s.io/kustomize/kyaml/kio"
	"sigs.k8s.io/kustomize/kyaml/yaml"
)

func Parse(f io.ReadWriter) error {
	rw := &kio.ByteReadWriter{
		Reader:                f,
		Writer:                f,
		KeepReaderAnnotations: true,
		PreserveSeqIndent:     true,
	}
	rnodes, err := rw.Read()
	if err != nil {
		return err
	}
	// filter images
	//p := kio.pipeline{
	//	inputs:                []kio.reader{rw},
	//	filters:               []kio.filter{filter{}},
	//	outputs:               os.std,
	//	continueonemptyresult: false,
	//}

	filter := filter{}
	_, err = filter.Filter(rnodes)
	if err != nil {
		return err
	}

	return nil
}

type filter struct{}

func (filter) Filter(in []*yaml.RNode) ([]*yaml.RNode, error) {
	for _, r := range in {
		if err := findImage(r); err != nil {
			return nil, err
		}
	}
	return in, nil
}

func findImage(r *yaml.RNode) error {

	//TODO (Dax): Handle initContainers https://sourcegraph.com/github.com/google/k8s-digester/-/blob/pkg/resolve/resolve.go#L60:10
	containers, err := r.Pipe(yaml.Lookup("spec", "template", "spec", "containers"))
	if err != nil {
		return fmt.Errorf("%v: %s", err, r.GetName())
	}
	if containers == nil {
		// TODO (Dax): Remove
		//s, _ := r.String()
		fmt.Printf("no images founds in %s:%s \n", r.GetKind(), r.GetName())
		return nil
	}

	// visit each container in list
	return containers.VisitElements(func(node *yaml.RNode) error {
		//image, err := node.Pipe(yaml.Lookup("image"))
		image := node.Field("image")
		if image == nil {
			return fmt.Errorf("couldn't find image for container %s", node.GetName())
		}
		s, err := image.Value.String()
		if err != nil {
			return err
		}
		updatedImage, err := updateImage(s)
		fmt.Println(updatedImage)

		// TODO (Dax): Remove
		fmt.Printf("found image %s for container %s in file %s+%s", s, node.GetName(), r.GetKind(), r.GetName())
		return nil
	})
}

type ImageReference struct {
	Registry string // index.docker.io
	Name     string // sourcegraph/frontend
	Version  string
	Digest   digest.Digest // sha256:7173b809ca12ec5dee4506cd86be934c4596dd234ee82c0662eac04a8c2c71dc
	Tag      string        // insiders
}

func updateImage(rawImage string) (string, error) {
	ref, err := reference.ParseNormalizedNamed(strings.TrimSpace(rawImage))
	if err != nil {
		return "", err
	}

	imgRef := &ImageReference{}

	// TODO Handle images without registry specified
	imgRef.Registry = reference.Domain(ref)
	if nameTagged, ok := ref.(reference.NamedTagged); ok {
		imgRef.Tag = nameTagged.Tag()
		imgRef.Name = reference.Path(nameTagged)
		if canonical, ok := ref.(reference.Canonical); ok {
			newNamed, err := reference.WithName(canonical.Name())
			if err != nil {
				return "", err
			}
			newCanonical, err := reference.WithDigest(newNamed, canonical.Digest())
			if err != nil {
				return "", err
			}
			imgRef.Digest = newCanonical.Digest()
		}
	}

	// TODO reuse this so we don't need to grab fresh auth tokens every time
	imgRepo := &imageRepository{
		name: imgRef.Name,
	}
	imgRepo.authToken, err = imgRepo.fetchAuthToken(imgRef.Registry)

	tags, err := imgRepo.fetchAllTags()
	if err != nil {
		return "", err
	}

	tag := findLatestTag(tags)

	fmt.Println(tag)
	return ref.String(), nil

}

type imageRepository struct {
	name             string
	isDockerRegistry bool
	authToken        string
}

const (
	legacyDockerhub = "index.docker.io"
	dockerhub       = "docker.io"
)

var ErrUnsupportedRegistry error = errors.New("unsupported registry")

func (i *imageRepository) fetchAuthToken(registryName string) (string, error) {
	if registryName != legacyDockerhub && registryName != dockerhub {
		i.isDockerRegistry = false
		return "", ErrUnsupportedRegistry
	} else {
		i.isDockerRegistry = true
	}

	resp, err := http.Get(fmt.Sprintf("https://auth.docker.io/token?service=registry.docker.io&scope=repository:%s:pull", registryName))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	result := struct {
		Token string
	}{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return "", err
	}
	return result.Token, nil
}

const dockerImageTagsURL = "https://index.docker.io/v2/%s/tags/list"

func (i *imageRepository) fetchAllTags() ([]string, error) {
	if !i.isDockerRegistry {
		return nil, ErrUnsupportedRegistry
	}

	req, err := http.NewRequest("GET", fmt.Sprintf(dockerImageTagsURL, i.name), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer"+i.authToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil || resp.StatusCode > 200 {
		return nil, err
	}
	result := struct {
		Tags []string
	}{}

	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return nil, err
	}

	return result.Tags, nil
}

// Assume we use 'sourcegraph' tag format of :[build_number]_[date]_[short SHA1]
func findLatestTag(tags []string) string {
	maxBuildID := 0

	for _, tag := range tags {
		s := strings.Split(tag, "_")
		if len(s) != 3 {
			continue
		}
		b, err := strconv.Atoi(s[0])
		if err != nil {
			fmt.Printf("encountered err converting tag: ", err)
			continue
		}
		if b > maxBuildID {
			maxBuildID = b
		}
	}
	return strconv.Itoa(maxBuildID)
}
