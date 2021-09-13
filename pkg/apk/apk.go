package apk

import (
	"io"

	"github.com/shogo82148/androidbinary"
	"github.com/shogo82148/androidbinary/apk"
)

func Parse(readerAt io.ReaderAt, size int64) (*APK, error) {
	pkg, err := apk.OpenZipReader(readerAt, size)
	if err != nil {
		return nil, err
	}
	defer pkg.Close()

	icon, err := pkg.Icon(&androidbinary.ResTableConfig{
		Density: 720,
	})
	if err != nil {
		// NOTE: ignore error
	}

	resConfigEN := &androidbinary.ResTableConfig{
		Language: [2]uint8{uint8('z'), uint8('h')},
		Country:  [2]uint8{uint8('C'), uint8('N')},
	}
	appLabel := ""
	appLabel, _ = pkg.Label(resConfigEN) // get app label for en translation

	return &APK{
		icon:     icon,
		manifest: pkg.Manifest(),
		size:     size,
		appLabel: appLabel,
	}, nil
}
