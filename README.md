# Journer — Sandbox Branch

## Purpose

This branch exists as the dedicated sandbox environment for Journer. It is the **only** branch that will live here alongside `master`.

## What this branch is for

`sandbox` is used to test new features, ideas, and solutions in Vercel's **Preview deployment** environment before they are ready to be merged into `master` (Production).

By keeping experimental work isolated here, we avoid polluting the Production environment with unfinished or untested changes. Every push to `sandbox` automatically triggers a Vercel Preview deployment, giving us a real, shareable URL to validate changes safely.

## Workflow

1. Develop and test new solutions on `sandbox`
2. Verify everything works as expected via the Vercel Preview URL
3. Once stable, cherry-pick or merge the changes into `master` for Production release
