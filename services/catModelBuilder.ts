
import * as THREE from 'three';

export function createCatModel(bodyClr: number, eyeClr: number, size: number = 1): THREE.Group {
    const group = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: bodyClr, shininess: 30 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.scale.set(1 * size, 0.8 * size, 1.2 * size);
    group.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ color: bodyClr, shininess: 30 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0.5 * size, 0.3 * size, 0);
    head.scale.set(1 * size, 0.9 * size, 0.9 * size);
    group.add(head);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: eyeClr, shininess: 60 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.75 * size, 0.35 * size, 0.12 * size);
    group.add(leftEye);

    const rightEye = leftEye.clone();
    rightEye.position.set(0.75 * size, 0.35 * size, -0.12 * size);
    group.add(rightEye);

    // Pupils
    const pupilGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    const pupilMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(0.78 * size, 0.35 * size, 0.12 * size);
    group.add(leftPupil);

    const rightPupil = leftPupil.clone();
    rightPupil.position.set(0.78 * size, 0.35 * size, -0.12 * size);
    group.add(rightPupil);

    // Ears
    const earGeometry = new THREE.ConeGeometry(0.1, 0.2, 16);
    const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
    leftEar.position.set(0.6 * size, 0.5 * size, 0.15 * size);
    leftEar.rotation.z = -Math.PI / 4;
    leftEar.scale.set(size, size, size);
    group.add(leftEar);

    const rightEar = leftEar.clone();
    rightEar.position.set(0.6 * size, 0.5 * size, -0.15 * size);
    group.add(rightEar);

    // Tail
    const tailCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.5 * size, 0, 0),
        new THREE.Vector3(-0.7 * size, 0.2 * size, 0),
        new THREE.Vector3(-0.9 * size, 0.3 * size, 0),
        new THREE.Vector3(-0.8 * size, 0.4 * size, 0)
    ]);
    const tailGeometry = new THREE.TubeGeometry(tailCurve, 10, 0.04 * size, 6, false);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    group.add(tail);

    // Paws
    const pawGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const pawMaterial = new THREE.MeshPhongMaterial({ color: bodyClr, shininess: 30 });
    const positions: [number, number, number][] = [
        [-0.3 * size, -0.5 * size, 0.2 * size],
        [-0.3 * size, -0.5 * size, -0.2 * size],
        [0.3 * size, -0.5 * size, 0.2 * size],
        [0.3 * size, -0.5 * size, -0.2 * size]
    ];
    positions.forEach(pos => {
        const paw = new THREE.Mesh(pawGeometry, pawMaterial);
        paw.position.set(...pos);
        paw.scale.set(size, size, size);
        group.add(paw);
    });

    return group;
}
