package main

import (
	"context"
	"flag"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"github.com/sourcegraph/sourcegraph/dev/sg/internal/images"

	"github.com/sourcegraph/sourcegraph/lib/output"

	"github.com/peterbourgon/ff/v3/ffcli"
)

var (
	opsFlagSet = flag.NewFlagSet("sg ops", flag.ExitOnError)
	opsCommand = &ffcli.Command{
		Name:       "ops",
		ShortUsage: "sg ops <sub-command>",
		ShortHelp:  "Commands used by operations teams to perform common tasks",
		LongHelp:   constructOpsCmdLongHelp(),
		FlagSet:    opsFlagSet,
		Exec: func(ctx context.Context, args []string) error {
			return flag.ErrHelp
		},
		Subcommands: []*ffcli.Command{opsUpdateImagesCommand},
	}
	opsUpdateImagesFlagSet = flag.NewFlagSet("sg ops update-images", flag.ExitOnError)
	opsUpdateImagesCommand = &ffcli.Command{
		Name:        "update-images",
		ShortUsage:  "sg ops update-images [flags] /dir",
		ShortHelp:   "Updates images in given directory to latest published image",
		LongHelp:    "Updates images in given directory to latest published image",
		UsageFunc:   nil,
		FlagSet:     opsUpdateImagesFlagSet,
		Options:     nil,
		Subcommands: nil,
		Exec:        opsUpdateImage,
	}
)

func constructOpsCmdLongHelp() string {
	var out strings.Builder

	fmt.Fprintf(&out, "Commands used by operations teams to perform common tasks")
	fmt.Fprintf(&out, "\n")
	fmt.Fprintf(&out, "Supported subcommands")
	fmt.Fprintf(&out, "update-images -> Updates images when run from the root of 'deployment' repo")
	fmt.Fprintf(&out, "\n")
	fmt.Fprintf(&out, "Supports: deploy-sourcegraph, deploy-sourcegraph-dogfood, deploy-sourcegraph-dot-com")

	return out.String()
}

func opsUpdateImage(ctx context.Context, args []string) error {
	if len(args) == 0 {
		out.WriteLine(output.Linef("", output.StyleWarning, "No path provided"))
		return flag.ErrHelp
	}
	if len(args) != 1 {
		out.WriteLine(output.Linef("", output.StyleWarning, "multiple paths not currently supported"))
		return flag.ErrHelp
	}

	var walkFunc = func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		// try to avoid .git, .idea folders
		if d.IsDir() || strings.HasPrefix(path, ".") {
			return nil
		}
		// only read YAML files (for now)
		if !strings.Contains(d.Name(), "yaml") {
			return nil
		}

		f, err := os.Open(path)
		if err != nil {
			return fmt.Errorf("encountered %w while opening file %s", err, path)
		}
		err = images.Parse(f)
		if err != nil {
			return err
		}
		return nil
	}

	err := filepath.WalkDir(args[0], walkFunc)
	if err != nil {
		return err
	}
	return nil
}
