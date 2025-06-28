import gsap from 'https://esm.sh/gsap';
import CursorBlob from 'https://esm.sh/cursor-blob';

// Register GSAP with the CursorBlob library
CursorBlob.registerGSAP(gsap);

// Select the DOM elements for the cursor
const cursorEl = document.querySelector('.cursor');
const cursorRimEl = document.querySelector('.cursor__rim');
const cursorDotEl = document.querySelector('.cursor__dot');

// Initialize the CursorBlob
const cursorBlob = new CursorBlob({
  cursorEl,
  cursorRimEl,
  cursorDotEl,
  duration: 0.8,
  ease: 'expo.out',
});