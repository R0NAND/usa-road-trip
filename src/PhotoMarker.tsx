import { useEffect, useState } from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";
import { PhotoData } from "./types/PhotoData";

interface Props {
  photo: PhotoData;
  onClick: () => void;
}

const PhotoMarker = ({ photo, onClick }: Props) => {
  const getCustomIcon = (iconUrl: string) => {
    return L.divIcon({
      className: `relative bg-cover`,
      html: `<img class="${
        isSelected ? "w-30 h-auto rounded-2xl" : "w-10 h-10 rounded-full"
      } -translate-1/2 border-2 border-white" src="${iconUrl}"/>`,
    });
  };

  const [isSelected, setIsSelected] = useState(false);

  useEffect(() => {
    if (isSelected) {
      const deselect = () => {
        setIsSelected(false);
      };
      setTimeout(() => {
        window.addEventListener("click", deselect, { once: true });
      }, 0);
    }
  }, [isSelected]);

  return (
    <Marker
      position={[photo.latitude, photo.longitude]}
      icon={getCustomIcon(
        isSelected
          ? `${photo.root_url}w_200,c_fill,q_80/${photo.id}.jpg`
          : `${photo.root_url}w_40,h_40,c_fill,q_80/${photo.id}.jpg`
      )}
      eventHandlers={{
        click: () => {
          if (!isSelected) {
            setIsSelected(true);
          }
          onClick();
        },
      }}
      zIndexOffset={isSelected ? 1000 : 0}
    ></Marker>
  );
};

export default PhotoMarker;
