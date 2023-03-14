# Standard Library
import hashlib
from dataclasses import dataclass

try:
    # Third-party
    import magic  # type: ignore
except ImportError as e:

    # Standard Library
    import platform

    template = "Sematic requires the `libmagic` package. Please install it{os_message}"
    mapping = {
        "Darwin": " with `brew install libmagic`, or with `port install file`",
        "Linux": (
            " with `sudo apt-get install libmagic1`, "
            "or with `sudo yum install file-devel`"
        ),
    }

    error_message = template.format(os_message=mapping.get(platform.system(), "."))
    raise ImportError(error_message) from e

# Sematic
from sematic.types.registry import SummaryOutput, register_to_json_encodable_summary


@dataclass
class Image:
    """
    A simple type to display images in the dashboard.
    """

    bytes: bytes

    @classmethod
    def from_file(cls, file_path: str) -> "Image":
        with open(file_path, "rb") as file:
            return Image(bytes=file.read())


@register_to_json_encodable_summary(Image)
def _image_to_summary(value: Image, _) -> SummaryOutput:
    blob_id = hashlib.sha1(value.bytes).hexdigest()

    mime_type = magic.from_buffer(value.bytes, mime=True)

    summary = {"mime_type": mime_type, "bytes": {"blob": blob_id}}

    return summary, {blob_id: value.bytes}
