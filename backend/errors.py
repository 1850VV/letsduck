"""Machine-readable validation codes, separate from compatibility display messages."""
class LocalizedError(ValueError):
    def __init__(self, message, *, code='request.invalid', params=None):
        super().__init__(message)
        self.code=code
        self.params=params or {}

def payload(error):
    return {'error':str(error),'code':getattr(error,'code','request.invalid'),'params':getattr(error,'params',{})}
