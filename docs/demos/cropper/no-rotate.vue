<script setup lang="ts">
import { Cropper } from '@wuhu-ui/cropper'
</script>

<template>
  <Cropper
    src="/samples/banner.png"
    alt="禁止旋转裁剪"
    :height="280"
    :rotatable="false"
    :initial-coverage="0.7"
  />
</template>

<style lang="less">
/* Cropper demo variants */
.cropper-avatar {
  display: block;
  width: 96px;
  height: 96px;
  border: 3px solid var(--w-color-surface);
  border-radius: 50%;
  background: var(--w-color-surface-subtle);
  box-shadow: var(--w-shadow-md);
  object-fit: cover;

  &--empty {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed var(--w-color-border-strong);
    color: var(--w-color-text-tertiary);
    font-size: 11px;
    box-shadow: none;
  }
}

.cropper-api {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cropper-api__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.cropper-readout {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;

  > div {
    padding: 8px 10px;
    border: 1px solid var(--w-color-border);
    border-radius: 8px;
    background: var(--w-color-surface-subtle);
    color: var(--w-color-text);
    font-family: var(--w-font-family-mono);
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    display: block;
    margin-bottom: 2px;
    color: var(--w-color-text-tertiary);
    font-family: var(--w-font-family);
    font-size: 10px;
  }
}
/* Cropper demo */
.cropper-demo {
  display: grid;
  align-items: start;
  grid-template-columns: minmax(0, 1fr) 190px;
  gap: 16px;
}

.cropper-demo__stage {
  min-width: 0;
}

.cropper-demo__aspects {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;

  .button.is-active {
    border-color: var(--w-color-primary-soft-hover);
    background: var(--w-color-primary-soft);
    color: var(--w-color-primary);
  }
}

.cropper-demo__side {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--w-color-border);
  border-radius: 14px;
  background: var(--w-color-surface-subtle);
}

.cropper-demo__label {
  color: var(--w-color-text-tertiary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.cropper-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px dashed var(--w-color-border-strong);
  border-radius: 12px;
  background: var(--w-color-surface);
  color: var(--w-color-text-tertiary);
  font-size: 11px;
  text-align: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.cropper-toolbar {
  position: absolute;
  top: 10px;
  left: 50%;
  z-index: 2;
  display: flex;
  gap: 2px;
  transform: translateX(-50%);
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--w-radius-full, 9999px);
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.72), rgba(15, 23, 42, 0.62));
  box-shadow:
    0 2px 6px rgba(15, 23, 42, 0.18),
    0 10px 24px -8px rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(12px) saturate(1.2);
  pointer-events: none;

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    flex: none;
    padding: 0 8px;
    border: 0;
    border-radius: var(--w-radius-full, 9999px);
    background: transparent;
    color: rgba(255, 255, 255, 0.9);
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
    pointer-events: auto;
    cursor: pointer;
    transition:
      background-color var(--w-duration-fast, 120ms) ease,
      color var(--w-duration-fast, 120ms) ease,
      transform var(--w-duration-fast, 120ms) ease;

    svg {
      width: 15px;
      height: 15px;
      fill: none;
      stroke: currentcolor;
      stroke-width: 1.9;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(0) scale(0.96);
    }

    &:focus-visible {
      outline: 2px solid rgba(255, 255, 255, 0.8);
      outline-offset: 1px;
    }

    &:disabled {
      color: rgba(255, 255, 255, 0.38);
      cursor: default;
    }

    &:last-child {
      margin-left: 2px;
      padding: 0 10px;
    }
  }
}
@media (max-width: 900px) {
  .cropper-readout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
