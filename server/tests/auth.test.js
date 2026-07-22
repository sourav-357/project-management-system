import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

test('JWT Access Token Generation & Payload Validation', () => {
    const mockUserId = '60d5ec49f1b2c81128e45678';
    const mockRole = 'Student';
    const secret = 'test_secret_key_12345';

    const token = jwt.sign({ id: mockUserId, role: mockRole }, secret, { expiresIn: '15m' });
    assert.ok(token);

    const decoded = jwt.verify(token, secret);
    assert.equal(decoded.id, mockUserId);
    assert.equal(decoded.role, mockRole);
});

test('File size limit calculation check', () => {
    const tenMB = 10 * 1024 * 1024;
    const fiveHundredMB = 500 * 1024 * 1024;

    assert.equal(tenMB, 10485760);
    assert.ok(fiveHundredMB > tenMB, '500MB must exceed the 10MB limit');
});
