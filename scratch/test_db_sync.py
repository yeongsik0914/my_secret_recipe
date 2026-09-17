import urllib.request
import json
import sys

def post(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def get(url):
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read().decode('utf-8'))

def main():
    print("=== Step 0: Reset user_default to clean 5 items ===")
    clean_user_inv = [
        {'id': 'usr_1', 'name': '삼겹살', 'count': 250, 'unit': 'g', 'shelf': 'meat', 'freshness': 'fresh', 'daysLeft': 4},
        {'id': 'usr_2', 'name': '김치', 'count': 300, 'unit': 'g', 'shelf': 'sauce', 'freshness': 'fresh', 'daysLeft': 14},
        {'id': 'usr_3', 'name': '두부', 'count': 1, 'unit': '모', 'shelf': 'dairy', 'freshness': 'warn', 'daysLeft': 2},
        {'id': 'usr_4', 'name': '대파', 'count': 1, 'unit': '대', 'shelf': 'vege', 'freshness': 'fresh', 'daysLeft': 5},
        {'id': 'usr_5', 'name': '즉석밥', 'count': 2, 'unit': '공기', 'shelf': 'sauce', 'freshness': 'fresh', 'daysLeft': 45}
    ]
    post('http://localhost:8080/api/fridge/sync', {'userId': 'user_default', 'inventory': clean_user_inv})

    print("=== Step 1: User Login (user@kitchenchef.com) ===")
    login_res = post('http://localhost:8080/api/auth/login', {'email': 'user@kitchenchef.com', 'password': 'user1234!'})
    print(f"Status: {login_res['status']}, User ID: {login_res['user']['id']}, Inventory items: {len(login_res['user'].get('inventory', []))}")
    assert len(login_res['user']['inventory']) == 5, f"Expected 5 items, got {len(login_res['user']['inventory'])}"

    print("=== Step 2: GET user fridge via REST API ===")
    fridge_res = get('http://localhost:8080/api/fridge/user_default')
    print(f"Items count: {len(fridge_res.get('inventory', []))}")
    assert len(fridge_res['inventory']) == 5

    print("=== Step 3: Modify inventory and sync to DB ===")
    updated_inv = fridge_res['inventory']
    updated_inv[0]['count'] = 300
    updated_inv.append({
        'id': 'test_ing_new',
        'name': '양파',
        'count': 2,
        'unit': '개',
        'shelf': 'vege',
        'freshness': 'fresh',
        'daysLeft': 7,
        'selected': True
    })
    sync_res = post('http://localhost:8080/api/fridge/sync', {'userId': 'user_default', 'inventory': updated_inv})
    print(f"Sync status: {sync_res['status']}, Synced items count: {len(sync_res['inventory'])}")

    print("=== Step 4: Verify DB persistence ===")
    re_fridge = get('http://localhost:8080/api/fridge/user_default')
    print(f"Re-fetched count: {len(re_fridge['inventory'])}, Item names: {[x['name'] for x in re_fridge['inventory']]}")
    assert len(re_fridge['inventory']) == 6

    print("=== Step 5: Admin Login (admin@kitchenchef.com) ===")
    admin_login = post('http://localhost:8080/api/auth/login', {'email': 'admin@kitchenchef.com', 'password': 'admin1234!'})
    print(f"Admin login status: {admin_login['status']}, Inventory count: {len(admin_login['user']['inventory'])}")
    assert len(admin_login['user']['inventory']) >= 12

    print("=== Step 6: Guest fridge check ===")
    guest_fridge = get('http://localhost:8080/api/fridge/guest')
    print(f"Guest fridge status: {guest_fridge['status']}, Count: {len(guest_fridge.get('inventory', []))}")

    print("=== Step 7: Reset user_default back to clean 5 items ===")
    post('http://localhost:8080/api/fridge/sync', {'userId': 'user_default', 'inventory': clean_user_inv})
    print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    main()
