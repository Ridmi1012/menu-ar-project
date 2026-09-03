# MenuAR

MenuAR is a browser-based augmented reality food preview experience developed for the INTE 42312 Virtual and Augmented Reality individual assignment.

The application includes two AR experiences:

- **Scan the Menu**: marker-based AR using AR.js and A-Frame.
- **View Food on Table**: markerless AR using the WebXR Device API and Three.js hit-testing.

Users can preview Burger and Pizza models, place them on a real table, change size, move or remove a dish, add multiple dishes to an order, and confirm the final preview.

## Technologies Used

- A-Frame 1.6.0
- AR.js 3.4.7
- Three.js 0.180.0
- WebXR Device API
- WebXR Hit Test API
- GLTFLoader
- HTML, CSS and JavaScript

## 3D Model Credits

The project uses two externally sourced 3D food assets.

### Burger

- **Model:** CC0 - Hamburger
- **Creator:** Plaggy / Marcel Plagmann
- **License:** CC0 1.0 Universal / Public Domain Dedication
- **Project file:** `assets/models/burger.glb`

The original downloaded Burger package contained the burger model together with several texture files. During optimization, unused Pizza-related textures that were not referenced by the Burger scene were removed before exporting the final GLB.

### Pizza

- **Model:** CC0 - Pizza Salami
- **Creator:** Plaggy / Marcel Plagmann
- **License:** CC0 1.0 Universal / Public Domain Dedication
- **Project file:** `assets/models/pizza.glb`

The Pizza package included a high-resolution metallic-roughness texture. This texture was reduced from 4096 × 4096 to 1024 × 1024 before the final GLB export.

> The model licensing evidence used for this project was taken from the creator's product listings, which identify the assets as CC0 1.0 Universal / Public Domain Dedication. Screenshots of the licensing evidence should be retained with the project documentation.

## 3D Asset Optimization

The models were optimized before being used in the browser AR experience to reduce loading cost while keeping acceptable visual quality.

### Burger Optimization

Original complete glTF package:

- **8,183,036 bytes**
- Approximately **7.80 MB**

The original package contained additional texture files that were not referenced by the Burger scene. These unused files were removed.

Cleaned package:

- **4,108,828 bytes**

Final GLB:

- **4,106,504 bytes**
- Approximately **3.91 MB**

Overall reduction from the original package to the final Burger GLB:

- Approximately **49.82%**

The main Burger optimization was **unused texture removal**, followed by conversion from the multi-file glTF package to a single GLB file.

### Pizza Optimization

Original complete glTF package:

- **4,150,495 bytes**
- Approximately **3.95 MB**

The metallic-roughness texture was originally:

- **4096 × 4096**
- **1,600,529 bytes**

It was resized to:

- **1024 × 1024**
- **376,695 bytes**

Optimized package:

- **2,926,661 bytes**

Final GLB:

- **2,924,364 bytes**
- Approximately **2.78 MB**

Overall reduction from the original package to the final Pizza GLB:

- Approximately **29.54%**

The main Pizza optimization was **texture resolution reduction**, followed by conversion to GLB.

## GLB Conversion

The downloaded assets were originally supplied as glTF packages containing a `.gltf` file and separate texture/resource files.

They were converted to `.glb` using the **Cesium glTF Tools** extension in Visual Studio Code.

The final application uses:

```text
assets/models/burger.glb
assets/models/pizza.glb
```

GLB was used because it packages the model resources into a single file, making asset management and loading simpler for the web-based AR application.

## Validation

Both final GLB files were tested in the Khronos glTF Sample Viewer.

Validation result for both models:

- **0 errors**
- **0 warnings**
- **2 informational messages**

The final models were also tested directly inside both MenuAR AR experiences.

## Important Optimization Note

No polygon reduction or mesh decimation was performed on these models.

The optimization methods actually used were:

- Removal of unused texture assets from the Burger package.
- Reduction of the Pizza metallic-roughness texture from 4096 × 4096 to 1024 × 1024.
- Conversion of the cleaned/optimized glTF packages to GLB.

The large file-size reductions should therefore not be attributed to GLB conversion alone.

## AR Features

### Marker-Based AR

- Camera-based marker tracking
- Burger and Pizza model switching
- 3D model reveal animation
- AR lighting
- Mobile-friendly interface

### Markerless AR

- WebXR immersive AR session
- Spatial tracking using WebXR hit-testing
- Surface reticle
- Tap-to-place interaction
- Burger and Pizza selection
- Small, Medium and Large sizes
- Move and reposition
- Remove dish
- Multiple dish ordering flow
- Order summary and confirmation
- Placement animation
- Confirmation animation
- Generated Web Audio feedback
- Soft contact shadows
- Optional WebXR anchor support where available

## Notes

Markerless AR support depends on the browser and device. A compatible Android device and browser with WebXR immersive AR support are required.

Surface detection works best on well-lit, textured surfaces. Smooth, reflective or featureless surfaces may be difficult for the device's underlying AR tracking system to detect reliably.

## License and Attribution

The Burger and Pizza assets are credited to **Plaggy / Marcel Plagmann** and are used under **CC0 1.0 Universal / Public Domain Dedication** according to the creator's product listings.

Frameworks and libraries remain subject to their respective licenses.
