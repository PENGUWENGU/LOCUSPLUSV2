import React, { useState } from 'react';
import { X, Star, Trash2, Edit2, MapPin } from 'lucide-react';
import { useSpoof } from '../../context/SpoofContext';
import { SavedPlace } from '../../types';

interface PlacesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlacesModal: React.FC<PlacesModalProps> = ({ isOpen, onClose }) => {
  const {
    favorites,
    recents,
    teleport,
    renameFavorite,
    removeFavorite,
    removeRecent,
  } = useSpoof();

  const [placeToRename, setPlaceToRename] = useState<SavedPlace | null>(null);
  const [renameText, setRenameText] = useState('');

  if (!isOpen) return null;

  const handleSelectPlace = (place: SavedPlace) => {
    teleport({ latitude: place.latitude, longitude: place.longitude });
    onClose();
  };

  const handleStartRename = (e: React.MouseEvent, place: SavedPlace) => {
    e.stopPropagation();
    setPlaceToRename(place);
    setRenameText(place.name);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (placeToRename && renameText.trim()) {
      renameFavorite(placeToRename.id, renameText.trim());
    }
    setPlaceToRename(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md h-[80vh] sm:h-auto sm:max-h-[85vh] locus-glass rounded-t-[32px] sm:rounded-[28px] overflow-hidden flex flex-col border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-locus-warn fill-locus-warn" />
            <span>Places</span>
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Favorites Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Favorites ({favorites.length})
            </h4>

            {favorites.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white/5 text-center text-xs text-white/40">
                Star a pin from the map toolbar to save it here.
              </div>
            ) : (
              <div className="rounded-2xl bg-white/5 border border-white/5 divide-y divide-white/5 overflow-hidden">
                {favorites.map((place) => (
                  <div
                    key={place.id}
                    onClick={() => handleSelectPlace(place)}
                    className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                      <MapPin className="w-4 h-4 text-locus-accent shrink-0" />
                      <div className="truncate">
                        <div className="font-semibold text-white truncate text-xs">
                          {place.name}
                        </div>
                        <div className="font-mono text-[11px] text-white/40">
                          {place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleStartRename(e, place)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFavorite(place.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-locus-danger"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recents Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Recent Teleports ({recents.length})
            </h4>

            {recents.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white/5 text-center text-xs text-white/40">
                Your teleports will show up here.
              </div>
            ) : (
              <div className="rounded-2xl bg-white/5 border border-white/5 divide-y divide-white/5 overflow-hidden">
                {recents.map((place) => (
                  <div
                    key={place.id}
                    onClick={() => handleSelectPlace(place)}
                    className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                      <div className="w-2 h-2 rounded-full bg-white/30 shrink-0" />
                      <div className="truncate">
                        <div className="font-semibold text-white truncate text-xs">
                          {place.name}
                        </div>
                        <div className="font-mono text-[11px] text-white/40">
                          {place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecent(place.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-locus-danger opacity-60 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rename Modal Dialog */}
        {placeToRename && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <form
              onSubmit={handleSaveRename}
              className="w-full max-w-xs p-4 rounded-2xl locus-glass border border-white/15 space-y-4"
            >
              <h4 className="font-bold text-sm text-white">Rename Favorite</h4>
              <input
                type="text"
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                placeholder="Place name"
                className="w-full px-3 py-2 bg-black/60 border border-white/20 rounded-xl text-sm text-white focus:outline-none focus:border-locus-accent font-medium"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPlaceToRename(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-locus-accent text-black font-bold text-xs"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Done Button */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
