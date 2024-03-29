export const secp256k1 = function test(num) {
	const CURVE = {
		a: 0n,
		b: 7n,
		P: 2n ** 256n - 2n ** 32n - 977n,
		n: 2n ** 256n - 432420386565659656852420866394968145599n,
		// G x, y values taken from official secp256k1 document
		Gx: 55066263022277343669578718895168534326250603453777594175500187360389116729240n,
		Gy: 32670510020758816978083085130507043184471273380659243275938904335757337482424n,
		beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
	};
	// Always true for secp256k1.
	// We're including it here if you'll want to reuse code to support
	// different curve (e.g. secp256r1) - just set it to false then.
	// Endomorphism only works for Koblitz curves with a == 0.
	// It improves efficiency:
	// Uses 2x less RAM, speeds up precomputation by 2x and ECDH / sign key recovery by 20%.
	// Should always be used for Jacobian's double-and-add multiplication.
	// For affines cached multiplication, it trades off 1/2 init time & 1/3 ram for 20% perf hit.
	// https://gist.github.com/paulmillr/eb670806793e84df628a7c434a873066
	const USE_ENDOMORPHISM = CURVE.a === 0n;
	class JacobianPoint {
		constructor(x, y, z) {
			this.x = x;
			this.y = y;
			this.z = z;
		}
		static fromAffine(p) {
			return new JacobianPoint(p.x, p.y, 1n);
		}
		toAffine(invZ = invert(this.z)) {
			const invZ2 = invZ ** 2n;
			const x = mod(this.x * invZ2);
			const y = mod(this.y * invZ * invZ2);
			return new Point(x, y);
		}
		// Flips point to one corresponding to (x, -y) in Affine coordinates.
		negate() {
			return new JacobianPoint(this.x, mod(-this.y), this.z);
		}
		// Fast algo for doubling 2 Jacobian Points when curve's a=0.
		// Note: cannot be reused for other curves when a != 0.
		// From: http://hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html#doubling-dbl-2009-l
		// Cost: 2M + 5S + 6add + 3*2 + 1*3 + 1*8.
		double() {
			const X1 = this.x;
			const Y1 = this.y;
			const Z1 = this.z;
			const A = mod(X1 ** 2n);
			const B = mod(Y1 ** 2n);
			const C = mod(B ** 2n);
			const D = mod(2n * (mod(mod((X1 + B) ** 2n)) - A - C));
			const E = mod(3n * A);
			const F = mod(E ** 2n);
			const X3 = mod(F - 2n * D);
			const Y3 = mod(E * (D - X3) - 8n * C);
			const Z3 = mod(2n * Y1 * Z1);
			return new JacobianPoint(X3, Y3, Z3);
		}
		// Fast algo for adding 2 Jacobian Points when curve's a=0.
		// Note: cannot be reused for other curves when a != 0.
		// http://hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html#addition-add-1998-cmo-2
		// Cost: 12M + 4S + 6add + 1*2.
		// Note: 2007 Bernstein-Lange (11M + 5S + 9add + 4*2) is actually *slower*. No idea why.
		add(other) {
			if (!(other instanceof JacobianPoint)) {
				throw new TypeError("JacobianPoint#add: expected JacobianPoint");
			}
			const X1 = this.x;
			const Y1 = this.y;
			const Z1 = this.z;
			const X2 = other.x;
			const Y2 = other.y;
			const Z2 = other.z;
			if (X2 === 0n || Y2 === 0n) return this;
			if (X1 === 0n || Y1 === 0n) return other;
			const Z1Z1 = mod(Z1 ** 2n);
			const Z2Z2 = mod(Z2 ** 2n);
			const U1 = mod(X1 * Z2Z2);
			const U2 = mod(X2 * Z1Z1);
			// @ts-ignore
			const S1 = mod(Y1 * Z2 * Z2Z2);
			const S2 = mod(mod(Y2 * Z1) * Z1Z1);
			const H = mod(U2 - U1);
			const r = mod(S2 - S1);
			// H = 0 meaning it's the same point.
			if (H === 0n) {
				if (r === 0n) {
					return this.double();
				} else {
					return JacobianPoint.ZERO;
				}
			}
			const HH = mod(H ** 2n);
			const HHH = mod(H * HH);
			const V = mod(U1 * HH);
			const X3 = mod(r ** 2n - HHH - 2n * V);
			const Y3 = mod(r * (V - X3) - S1 * HHH);
			// @ts-ignore
			const Z3 = mod(Z1 * Z2 * H);
			return new JacobianPoint(X3, Y3, Z3);
		}
		// Non-constant-time multiplication. Uses double-and-add algorithm.
		// It's faster, but should only be used when you don't care about
		// an exposed private key e.g. sig verification, which works over *public* keys.
		multiplyUnsafe(scalar) {
			let n = normalizeScalar(scalar);
			// The condition is not executed unless you change global var
			if (!USE_ENDOMORPHISM) {
				let p = JacobianPoint.ZERO;
				let d = this;
				while (n > 0n) {
					if (n & 1n) p = p.add(d);
					// @ts-ignore
					d = d.double();
					n >>= 1n;
				}
				return p;
			}
			let { k1neg, k1, k2neg, k2 } = splitScalarEndo(n);
			let k1p = JacobianPoint.ZERO;
			let k2p = JacobianPoint.ZERO;
			let d = this;
			while (k1 > 0n || k2 > 0n) {
				if (k1 & 1n) k1p = k1p.add(d);
				if (k2 & 1n) k2p = k2p.add(d);
				// @ts-ignore
				d = d.double();
				k1 >>= 1n;
				k2 >>= 1n;
			}
			if (k1neg) k1p = k1p.negate();
			if (k2neg) k2p = k2p.negate();
			k2p = new JacobianPoint(mod(k2p.x * CURVE.beta), k2p.y, k2p.z);
			return k1p.add(k2p);
		}
	}
	JacobianPoint.ZERO = new JacobianPoint(0n, 1n, 0n);
	JacobianPoint.BASE = new JacobianPoint(CURVE.Gx, CURVE.Gy, 1n);
	class Point {
		constructor(x, y) {
			this.x = x;
			this.y = y;
		}
		multiply(scalar) {
			return JacobianPoint.fromAffine(this).multiplyUnsafe(scalar).toAffine();
		}
	}
	Point.ZERO = new Point(0n, 0n); // Point at infinity aka identity point aka zero
	Point.BASE = new Point(CURVE.Gx, CURVE.Gy);
	function mod(a, b = CURVE.P) {
		const result = a % b;
		return result >= 0 ? result : b + result;
	}
	// Inverses number over modulo
	function invert(number, modulo = CURVE.P) {
		if (number === 0n || modulo <= 0n) {
			throw new Error(`invert: expected positive integers, got n=${number} mod=${modulo}`);
		}
		// Eucledian GCD https://brilliant.org/wiki/extended-euclidean-algorithm/
		let a = mod(number, modulo);
		let b = modulo;
		let [x, y, u, v] = [0n, 1n, 1n, 0n];
		while (a !== 0n) {
			const q = b / a;
			const r = b % a;
			const m = x - u * q;
			const n = y - v * q;
			[b, a] = [a, r];
			[x, y] = [u, v];
			[u, v] = [m, n];
		}
		const gcd = b;
		if (gcd !== 1n) throw new Error("invert: does not exist");
		return mod(x, modulo);
	}
	function isWithinCurveOrder(num) {
		return 0 < num && num < CURVE.n;
	}
	function normalizeScalar(num) {
		if (typeof num === "number" && num > 0 && Number.isSafeInteger(num)) return BigInt(num);
		if (typeof num === "bigint" && isWithinCurveOrder(num)) return num;
		throw new TypeError("Expected valid private scalar: 0 < scalar < curve.n");
	}
	const divNearest = (a, b) => (a + b / 2n) / b;
	const POW_2_128 = 2n ** BigInt(128);
	// Split 256-bit K into 2 128-bit (k1, k2) for which k1 + k2 * lambda = K.
	// Used for endomorphism https://gist.github.com/paulmillr/eb670806793e84df628a7c434a873066
	function splitScalarEndo(k) {
		const { n } = CURVE;
		const a1 = BigInt("0x3086d221a7d46bcde86c90e49284eb15");
		const b1 = -1n * BigInt("0xe4437ed6010e88286f547fa90abfe4c3");
		const a2 = BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8");
		const b2 = a1;
		const c1 = divNearest(b2 * k, n);
		const c2 = divNearest(-b1 * k, n);
		// @ts-ignore
		let k1 = mod(k - c1 * a1 - c2 * a2, n);
		// @ts-ignore
		let k2 = mod(-c1 * b1 - c2 * b2, n);
		const k1neg = k1 > POW_2_128;
		const k2neg = k2 > POW_2_128;
		if (k1neg) k1 = n - k1;
		if (k2neg) k2 = n - k2;
		if (k1 > POW_2_128 || k2 > POW_2_128) throw new Error("splitScalarEndo: Endomorphism failed");
		return { k1neg, k1, k2neg, k2 };
	}
	const G = new Point(CURVE.Gx, CURVE.Gy);
	const PRIVATE_KEY = 0x2dee927079283c3c4fca3ef970ff4d38b64592e3fe0ab0dad9132d70b5bc7693n;
	let point = G;
	for (let i = 0; i < num; i++) {
		point = point.multiply(PRIVATE_KEY);
	}
	return Promise.resolve(`${point.x.toString(16)},${point.y.toString(16)}`);
};
