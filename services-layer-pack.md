# NEX Services Layer Pack

This pack defines the first behavioral spine of NEX Founder OS v1.

## Included services
- EventWriter
- TaskProjectionBuilder
- ResumePacketBuilder
- VerificationService
- TaskGateService
- TaskProgressService

## Runtime flow
`event -> projection -> resume -> verification -> gate -> progress`

## Purpose
Transform NEX from static schema into a stateful execution system.
